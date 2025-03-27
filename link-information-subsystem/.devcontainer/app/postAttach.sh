# gitの設定
git config --global --add safe.directory /workspace
git config pull.rebase false

npm i

cd /workspace/packages/backend/
cp .env.sample .env
npm run build:webpack

# aws-cdk-appをLocalStackにデプロイするための前準備
cd /workspace/packages/aws-cdk-app
cdklocal bootstrap

awslocal secretsmanager create-secret --name rds-db-credentials/cluster-XXSHMKZVQTF2KHDSXN5CU2BJDI/postgres/1731562394872 --description "db connect secret data" --secret-string "{\"proxyhost\":\"database\",\"username\":\"postgres\",\"password\":\"postgres\",\"dbname\":\"DMDB\",\"port\":\"5432\"}"