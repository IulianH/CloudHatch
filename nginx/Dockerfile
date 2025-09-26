FROM nginx:latest
COPY ./config/default.conf /etc/nginx/conf.d/default.conf
COPY ./config/common_headers.conf /etc/nginx/common_headers.conf
COPY ./config/nginx.conf /etc/nginx/nginx.conf
COPY ./ssl/self-signed.crt /etc/nginx/ssl/self-signed.crt
COPY ./ssl/self-signed.key /etc/nginx/ssl/self-signed.key
EXPOSE 80
EXPOSE 443

