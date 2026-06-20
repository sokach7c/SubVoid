# Docker 发布说明

本项目使用 `pnpm` 构建 Next.js 应用，并通过 GitHub Actions 在推送版本 Tag 时构建 Docker 镜像。

Dockerfile 固定使用 `pnpm@10.33.4`，避免 Corepack 在构建时自动激活不兼容的新版 pnpm。

## 本地镜像

Dockerfile 位于仓库根目录，运行时默认监听 `3000` 端口。

```bash
docker build --platform linux/amd64 -t subvoid:local .
docker run --rm -p 3000:3000 --env-file .env subvoid:local
```

也可以使用 Docker Compose 启动，SQLite 数据会持久化到宿主机 `./data` 目录：

```bash
docker compose up -d --build
docker compose logs -f subvoid
docker compose down
```

## 环境变量

至少需要配置：

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
JWT_SECRET=replace-with-a-long-random-secret
DATABASE_PATH=./data/subvoid.sqlite
PUBLIC_URL=https://subvoid.example.com
```

`PUBLIC_URL` 用于生成 Clash 持久订阅链接的公共地址前缀。

## GitHub Actions 发布

Workflow 文件：

```text
.github/workflows/docker-publish.yml
```

触发方式：

```bash
git tag v1.0.0
git push origin v1.0.0
```

推送到 `main` / `master` 分支、推送 `v*` Tag，或在 GitHub Actions 页面手动运行 workflow 都会触发构建。Workflow 会构建 `linux/amd64` 镜像并推送到 Docker Hub。

## Docker Hub Secrets

需要在 GitHub 仓库中配置以下 Secrets：

```text
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
```

默认推送镜像：

```text
DOCKERHUB_USERNAME/subvoid:v1.0.0
DOCKERHUB_USERNAME/subvoid:latest
DOCKERHUB_USERNAME/subvoid:sha-xxxxxxx
```
