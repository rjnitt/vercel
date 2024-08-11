const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mimetype = require("mime-types");
const Redis = require("ioredis");

const publisher = new Redis(
  process.env.REDIS_SERVER
);

function publishLog(log) {
  publisher.publish(`logs: ${PROJECT_ID}`, JSON.stringify({ log }));
}


const client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// const build = () => {
//   exec("npm run build", (err, stdout, stderr) => {
//     if (err) {
//       console.error(err);
//       return;
//     }
//     console.log(stdout);
//   });
// };
const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
  console.log("Executing script.js");
  publishLog("Executing script.js");
  const gitPath = path.join(__dirname, "output");

  const p = exec(`cd ${gitPath} && npm install && npm run build`);
  p.stdout.on("data", (data) => {
    console.log("logs::: ", data);
    publishLog(data.toString());
  });

  p.stderr.on("data", (data) => {
    console.error("error:::", data);
    publishLog(data.toString());
  });
  p.on("close", () => {
    console.log("Build Complete");
    publishLog("build complete");
    const allDistFiles = path.join(gitPath, "dist");
    const distFilesPath = fs.readdirSync(allDistFiles, { recursive: true });
    distFilesPath.forEach(async (file) => {
      const filePath = path.join(allDistFiles, file);
      if (fs.lstatSync(filePath).isFile()) {
        // const fileContent = fs.readFileSync(filePath, "utf8");
        console.log("uploading", filePath);
        const command = new PutObjectCommand({
          Bucket: "rjnitt-vercel",
          Key: `__output/${PROJECT_ID}/${file}`,
          Body: fs.createReadStream(filePath),
          ContentType: mimetype.lookup(filePath),
        });
        await client.send(command);
        console.log("uploaded", filePath);
        publishLog(`uploaded ${filePath}`);
      }
    });
    console.log("Done!!");
    publishLog(`Done!!`);
  });
}

init();
