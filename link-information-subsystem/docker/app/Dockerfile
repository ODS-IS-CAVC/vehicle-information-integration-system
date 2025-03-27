FROM node:20-bullseye-slim AS base

WORKDIR /workspace
RUN apt-get update -qq && apt-get upgrade -y
RUN apt-get install -y -qq --no-install-recommends procps
RUN apt-get install -y ca-certificates curl gnupg lsb-release
RUN apt-get install -y gdal-bin
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | \
  gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

RUN echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

RUN apt-get update && \
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin && \
  apt-get remove  -y ca-certificates curl gnupg lsb-release && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# local(local開発用)
FROM base AS local
RUN apt-get update
RUN apt-get install -y git curl unzip python3-distutils && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*
RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py && python3 get-pip.py
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN aws/install

RUN python3 -m pip install localstack awscli-local
RUN npm install -g aws-cdk-local aws-cdk
RUN npm install -g @nestjs/cli
