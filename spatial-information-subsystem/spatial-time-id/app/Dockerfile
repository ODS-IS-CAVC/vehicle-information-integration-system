FROM python:3.12 AS builder

ENV PYTHONUNBUFFERED True

RUN mkdir ouranos
WORKDIR /ouranos

RUN git clone https://github.com/kkc-kaitoyoshida/ouranos-gex-lib-for-Python.git .

WORKDIR /ouranos/src/
RUN pip install .


FROM python:3.12 AS production

ENV PYTHONUNBUFFERED True

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages/

COPY requirements.txt ./
RUN pip install -r requirements.txt

ENV APP_HOME /app
WORKDIR $APP_HOME
COPY api.py ./
COPY utils/ ./utils/
COPY routers/ ./routers/

EXPOSE 8080

VOLUME /tmp

CMD exec gunicorn  -k uvicorn.workers.UvicornWorker --bind :8080 --workers 1 --threads 2 --timeout 0 api:app --access-logfile - --error-logfile -