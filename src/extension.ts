import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const textFileExtensions = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".txt",
  ".css",
  ".html",
  ".scss",
  ".java",
];

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "copy-all-contents-in-a-folder.copy",
    async (uri: vscode.Uri) => {
      if (!uri || !uri.fsPath) {
        vscode.window.showErrorMessage("Invalid folder path.");
        return;
      }

      const folderPath = uri.fsPath;
      const folderName = path.basename(folderPath);

      // --- Fungsi untuk membuat tree ---
      function generateTree(currentPath: string, indent: string = ""): string {
        let tree = "";
        const files = fs.readdirSync(currentPath);

        for (const file of files) {
          const filePath = path.join(currentPath, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            tree += `${indent}└─ ${file}/\n`;
            tree += generateTree(filePath, indent + "│  "); // Rekursif, indentasi bertambah
          } else if (stat.isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            if (textFileExtensions.includes(ext)) {
              tree += `${indent}└─ ${file}\n`;
            }
          }
        }
        return tree;
      }

      async function processFolder(currentFolderPath: string): Promise<string> {
        let result = "";
        try {
          const files = fs.readdirSync(currentFolderPath);
          for (const file of files) {
            const filePath = path.join(currentFolderPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              if (textFileExtensions.includes(ext)) {
                try {
                  const fileContent = fs.readFileSync(filePath, "utf8");
                  const fileName = path.basename(filePath);
                  result += `//${fileName}\n${fileContent}\n\n`;
                } catch (error: any) {
                  vscode.window.showErrorMessage(
                    `Error reading file ${filePath}: ${error.message}`
                  );
                }
              }
            } else if (stat.isDirectory()) {
              result += await processFolder(filePath);
            }
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(
            `Error reading folder ${currentFolderPath}: ${error.message}`
          );
        }
        return result;
      }

      // 1. Buat tree
      const treeStructure = generateTree(folderPath);

      // 2. Proses folder untuk mendapatkan isi file
      const allContents = await processFolder(folderPath);

      // 3. Gabungkan tree dan isi file
      const finalClipboardContent = `${folderName}/\n${treeStructure}\n${allContents}`;

      vscode.env.clipboard.writeText(finalClipboardContent).then(
        () => {
          vscode.window.showInformationMessage(
            "Folder contents copied to clipboard!"
          );
        },
        (err) => {
          vscode.window.showErrorMessage(`Failed to copy to clipboard: ${err}`);
        }
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
