docker rm $(docker ps -a --format "{{.ID}} :{{.Command}}"| grep bun | grep -Po "^.*?(?=\:)") --force
docker run --privileged -d \
    --mount type=bind,source=/home/max,target=/xhome \
    --name fileapi \
    --env-file ./.env \
    -p 443:443 \
    litengut/fileapi fileapi‹

docker ps -a 