const express = require("express");
const httpProxy = require("http-proxy");

const app = express();
const BASE_PATH = "https://rjnitt-vercel.s3.ap-south-1.amazonaws.com/__output/";
const proxy = httpProxy.createProxyServer();

// a1.rjnitt.com -> basepath/__output/a1/index.html
app.use((req, res) => {
  console.log("Executing script.js");

  const hostname = req.hostname;
  const subdomain = hostname.split(".")[0];
  const resolveTo = `${BASE_PATH}${subdomain}`;
  console.log("Resolving to", resolveTo);

  return proxy.web(req, res, { target: resolveTo, changeOrigin: true });
});

proxy.on("proxyReq", function (proxyReq, req, res) {
  console.log("proxyReq", req.url);
  if (req.url === "/") {
    proxyReq.path += "index.html";
  }
  console.log("proxyReq", proxyReq.path);
  return proxyReq;
});

app.listen(8000, () => {
  console.log("Api Server started at port 8000");
});
