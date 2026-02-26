FROM python:3.9-slim

WORKDIR /app

RUN pip install flask requests

COPY . /app/

RUN chmod +x /app/start.sh

EXPOSE 5000

CMD ["/app/start.sh"]