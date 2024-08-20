import fs from "fs";
import cryptojs from "crypto-js";
import crypto from "crypto";
import { FileData, FileType } from "./File";
import { zipFolder, compressSingleFile, zipmultiple } from "./zip";

const domain = Bun.env.SERVER_URL;

const pass = crypto.randomBytes(16).toString("hex");

console.log(domain);

Bun.serve({
  port: Bun.env.SERVER_PORT,
  fetch(req) {
    const key = req.headers.get("server_secret");
    var res = new Response("404! ");
    const url = new URL(req.url);
    const pathname = url.pathname.split("/").filter((x) => x != "");
    switch (pathname[0]) {
      case "file":
        if (key === Bun.env.SERVER_SECRET) {
          res = file(pathname);
        }
        break;
      case "download":
        res = getFile(pathname[1]);
    }
    res.headers.set("Access-Control-Allow-Origin", "*");
    return res;
  },
  tls: {
    cert: Bun.file("cert/cert.pem"),
    key: Bun.file("cert/key.pem"),
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
      return getFile(pathname[2]);
    }
    case "getfiledata": {
      return getFileData(pathname);
    }
    case "deletefile": {
      return deleteFile(pathname);
    }
  }
  return new Response("404! para", {
    headers: { "Content-Type": "application/text" },
  });
}

function getDir(pathname: string[]): Response {
  var path = "/" + pathname.slice(2).join("/");
  console.log(path);
  const out: FileData[] = [];
  if (!fs.existsSync(path)) {
    return new Response("404! Dir path", {
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

function getFileData(pathname: string[]): Response {
  var path = "/" + pathname.slice(2).join("/");
  const filestats = fs.statSync(path);
  const fileData: FileData = {
    name: pathname[pathname.length - 1],
    size: filestats.size,
    type: filestats.isDirectory() ? FileType.Folder : FileType.File,
    lastModified: filestats.mtime.getTime(),
    created: filestats.birthtime.getTime(),
    path: path + "/" + file,
  };
  return new Response(JSON.stringify(fileData), {
    headers: { "Content-Type": "application/json" },
  });
}

function getFileURL(pathname: string[]): Response {
  var path = "/" + pathname.slice(2).join("/");
  if (!fs.existsSync(path)) {
    return new Response("404! file not found", {
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
  return new Response(domain + "/download/" + replaceAll, {
    headers: { "Content-Type": "application/text" },
  });
}

function getFile(pathname: string): Response {
  const replaceAll = pathname.replaceAll("-", "/");
  const path = cryptojs.AES.decrypt(replaceAll, pass).toString(
    cryptojs.enc.Utf8
  );
  if (!fs.existsSync(path)) {
    return new Response("404! file not found", {
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
  var path = "/" + pathname.slice(2).join("/");
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
