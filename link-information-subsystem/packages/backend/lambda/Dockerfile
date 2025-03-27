# ベースイメージを指定
FROM ubuntu:22.04

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    wget \
    libboost-all-dev \
    libgeos-dev \
    libgdal-dev \
    libatlas-base-dev \
    libproj-dev \
    libsqlite3-dev \
    libtiff-dev \
    libxml2-dev \
    libzstd-dev \
    python3 \
    python3-pip \
    curl

# PDAL依存パッケージのインストール
RUN python3 -m pip install numpy

RUN apt-get install -y sqlite3

RUN apt-get install libsqlite3-dev

RUN apt-get install proj-bin

RUN apt-get -y install libgtest-dev 

# PDALが依存関係にあるPROJソースコードをクローン
RUN git clone https://github.com/OSGeo/PROJ.git

# PROJのビルド
WORKDIR /PROJ
RUN mkdir build && cd build \
    && cmake .. \
    && make \
    && make install

# PDALのソースコードをクローン
RUN git clone https://github.com/PDAL/PDAL.git /PDAL

# PDALのビルド
WORKDIR /PDAL
RUN mkdir build && cd build \
    && cmake .. \
    && make \
    && make install

# ライブラリ情報を更新
RUN ldconfig

RUN python3 -m pip install pdal

RUN pip install awslambdaric

RUN pip install psycopg2-binary
RUN pip install psycopg2
RUN pip install boto3

RUN mkdir /function && \
  pip install --target /function awslambdaric
  
COPY app.py /function/

WORKDIR /function

ENTRYPOINT [ "/usr/bin/python3", "-m", "awslambdaric" ]

# Dockerコンテナが開始する時のデフォルトコマンドを指定
CMD [ "app.handler" ]

