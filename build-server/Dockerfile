# Use the official Ubuntu base image
FROM ubuntu:latest

# Update the package lists and install any necessary packages
RUN apt-get update && apt-get install -y \
    nodejs \
    git \
    curl

# Pull the curl code for Node.js
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get upgrade -y
RUN apt-get install -y nodejs

# Install git
RUN apt-get install -y git


WORKDIR /home/app

COPY main.sh main.sh
RUN chmod +x main.sh


COPY script.js script.js
RUN chmod +x script.js
COPY package*.json .

RUN npm install

# Define the command to run when the container starts
CMD [ "/home/app/main.sh" ]
