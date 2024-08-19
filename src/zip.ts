// index.js

import JSZip from "jszip";
import fs from "fs";
import path from "path";

export function zipFolder(folderPath: string, zipFilePath: string) {
  const zip = new JSZip();

  function addFilesToZip(zipFile: JSZip, folderPath: string, currentPath: string = "") {
    const files = fs.readdirSync(path.join(folderPath, currentPath));

    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const fullFilePath = path.join(folderPath, filePath);
      const stats = fs.statSync(fullFilePath);

      if (stats.isDirectory()) {
        addFilesToZip(zipFile, folderPath, filePath);
      } else {
        const fileContent = fs.readFileSync(fullFilePath);
        zipFile.file(filePath, fileContent);
      }
    }
  };

  addFilesToZip(zip, folderPath);
  zip.generateAsync({ type: "nodebuffer" }).then((content) => {
    fs.writeFileSync(zipFilePath, content);
  }).catch((error) => console.log(error));;

  console.log(`Zip file created at: ${zipFilePath}`);
  return zipFilePath
};

export function zipmultiple(files: string[], zipName: string) {
    const zip = new JSZip();
  
    function addFileToZip(zipFile: JSZip, filePath: string) {
      const fileContent = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
  
      zipFile.file(fileName, fileContent);
    };
  
    for (const file of files) {
      addFileToZip(zip, file);
    }
  
    const zipFileName = `${zipName}.zip`;
  
    zip.generateAsync({ type: "nodebuffer" }).then((content) => {
      fs.writeFileSync(zipFileName, content);
    }).catch((error) => console.log(error));;
  
    console.log(`Zip file created: ${zipFileName}`);
  };
export function compressSingleFile(filePath: string, zipName: string) {
    const zip = new JSZip();
  
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
  
    zip.file(fileName, fileContent);
  
    const zipFileName = `${zipName}.zip`;
  
    zip
      .generateAsync({ type: "nodebuffer" })
      .then((content) => {
        fs.writeFileSync(zipFileName, content);
      })
      .catch((error) => console.log(error));
  
    console.log(`Zip file created: ${zipFileName}`);
  };