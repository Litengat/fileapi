import fs from "fs";
import cryptojs from "crypto-js";
import crypto from "crypto";
import { FileData, FileType } from "./File";
import { BunFile } from "bun";
import { zipFolder, compressSingleFile, zipmultiple } from "./zip";

const domain = "http://localhost:3010";

const pass = crypto.randomBytes(16).toString("hex");

Bun.serve({
  port: 3010,
  fetch(req) {
    var res = new Response("404!");
    const url = new URL(req.url);
    const pathname = url.pathname.split("/").filter((x) => x != "");
    switch (pathname[0]) {
      case "file":
        res = file(pathname);
        break;
    }
    res.headers.set("Access-Control-Allow-Origin", "*");
    return res;
  },
});

function file(pathname: string[]): Response {
  switch (pathname[1]) {
    case "getdir": {
      return getDir(pathname);
    }
    case "getfileURL": {
      return getFileURL(pathname);
    }
    case "getfile": {
      return getFile(pathname);
    }
    case "deletefile": {
      return deleteFile(pathname);
    }
  }
  return new Response("404!", {
    headers: { "Content-Type": "application/text" },
  });
}

function getDir(pathname: string[]): Response {
  var path = "/" + pathname.slice(2).join("/");
  console.log(path);
  const out: FileData[] = [];
  if (!fs.existsSync(path)) {
    return new Response("404!", {
      headers: { "Content-Type": "application/text" },
    });
  }
  if (fs.statSync(path).isFile()) {
    return new Response(
      JSON.stringify({
        FileType: FileType.File,
        Files: [],
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
  fs.readdirSync(path).forEach((file) => {
    const filestats = fs.statSync(path + "/" + file);
    const fileData: FileData = {
      name: file,
      size: filestats.size,
      type: filestats.isDirectory() ? FileType.Folder : FileType.File,
      lastModified: filestats.mtime.getTime(),
      created: filestats.birthtime.getTime(),
      path: path + "/" + file,
    };
    out.push(fileData);
  });
  return new Response(
    JSON.stringify({
      FileType: FileType.Folder,
      Files: out,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

function getFileURL(pathname: string[]): Response {
  var path = "/" + pathname.slice(2).join("/");
  if (!fs.existsSync(path)) {
    return new Response("404!", {
      headers: { "Content-Type": "application/test" },
    });
  }
  if (fs.statSync(path).isDirectory()) {
    var extention = "-compressed-temp.zip";
    zipFolder(path, path + extention);
    path = path + extention;
  }
  const encrypted = cryptojs.AES.encrypt(
    path,
    pass,
    cryptojs.enc.Utf8
  ).toString();
  const replaceAll = encrypted.replaceAll("/", "-");
  return new Response(domain + "/file/getfile/" + replaceAll, {
    headers: { "Content-Type": "application/text" },
  });
}

function getFile(pathname: string[]): Response {
  const path = pathname[2].replaceAll("-", "/");
  if (!fs.existsSync(path)) {
    return new Response("404!", {
      headers: { "Content-Type": "application/test" },
    });
  }
  const file = Bun.file(path);
  if (pathname[pathname.length - 1].endsWith("-compressed-temp.zip")) {
    fs.rmSync(path);
  }
  return new Response(file, {
    headers: { "Content-Type": "application/text" },
  });
}

function deleteFile(pathname: string[]): Response {
  const replaceAll = pathname[2].replaceAll("-", "/");
  const path = cryptojs.AES.decrypt(replaceAll, pass).toString(
    cryptojs.enc.Utf8
  );
  if (!fs.existsSync(path)) {
    return new Response("404!", {
      headers: { "Content-Type": "application/test" },
    });
  }
  fs.rmSync(path);
  return new Response("200", {
    headers: { "Content-Type": "application/text" },
  });
}

/* fs.readdirSync("testDir").forEach(file => {
    console.log(file)
    const filestats = fs.statSync("testDir/" + file);
    const fileData: FileData = {
        name: file,
        size: filestats.size,
        type: FileType.File,
        lastModified: filestats.mtime.getTime(),
        created: filestats.birthtime.getTime(),
        path: file
    }
    console.log(fileData)
})  */

/* Bun.serve({
    port: 3010,
    fetch(req) {
        const url = new URL(req.url);
        const pathname = url.pathname.split("/").filter((x)=> x != "" )
        if(pathname[0] === "file"){
            const path = "/" + pathname.slice(2).join("/")
            console.log(path)
            if(fs.existsSync(path)){
                switch(pathname[1]){
                    case "getdir": {
                        const out = getDir(path)
                        return new Response(JSON.stringify(out), {headers: {"Content-Type": "application/json"}})
                    }
                    case "getfileURL": {
                        const encrypted = cryptojs.AES.encrypt(path, pass).toString()
                        console.log(encrypted)
                        console.log(cryptojs.AES.decrypt(encrypted, pass).toString(cryptojs.enc.Utf8))
                        return new Response("", {headers: {"Content-Type": "application/text"}})
                    }
                    case "getfile": {
                        const out = getFile(path)
                        return new Response(out, {headers: {"Content-Type": "application/octet-stream"}})
                    }
                }
            }
        }

        return new Response("404!");
        },
}); */
