const express = require("express");
const app = express();
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { generateSlug } = require("random-word-slugs");
const Redis = require("ioredis");
const { Server } = require("socket.io");
const subscriber = new Redis(
  process.env.REDIS_SERVER
);

const io = new Server({ cors: "*" });
io.listen(9002);

io.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});

app.use(express.json());
const ecsClient = new ECSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const config = {
  CLUSTER_DEFINITION:
    "arn:aws:ecs:ap-south-1:590183753846:cluster/vercel-cluster-2",
  TASK_DEFINITION:
    "arn:aws:ecs:ap-south-1:590183753846:task-definition/vercel-task:1",
};


const createTask = async (gitUrl, randomWord) => {
  const params = {
    cluster: config.CLUSTER_DEFINITION,
    taskDefinition: config.TASK_DEFINITION,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: "ENABLED",
        subnets: [
          "subnet-0359423292fa3049b",
          "subnet-0bfc5f11a0da7facf",
          "subnet-05fa2093585962655",
        ],
        securityGroups: ["sg-0bd804ba2a04e3528"],
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "builder-image",
          environment: [
            {
              name: "PROJECT_ID",
              value: randomWord,
            },
            {
              name: "GIT_REPOSITORY_URL",
              value: gitUrl,
            },
          ],
        },
      ],
    },
  };

  try {
    const command = new RunTaskCommand(params);
    const data = await ecsClient.send(command);
    console.log("Task created successfully:", data.tasks);
  } catch (error) {
    console.error("Error creating task:", error);
  }
};

app.post("/deploy", async (req, res) => {
  console.log("Deploying...");
  const { gitURL, slug } = req.body;
  const randomWord = slug ? slug : generateSlug();
  subscriber.subscribe(randomWord);
  await createTask(gitURL, randomWord);
  // res.send("Task created successfully");
  // acoustic-big-carpet.localhost:8000
  const resurl = `http://${randomWord}.localhost:8000`;
  return res.json({ message: "Task created successfully", randomWord, resurl });
});

async function initRedisSubscriber() {
  console.log("Subscribing...");
  subscriber.psubscribe("log:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    console.log("Received message:", message);
    io.to(channel).emit("message", message);
  });
}

initRedisSubscriber();

app.listen(9000, () => {
  console.log("Api Server started at port 9000");
});
