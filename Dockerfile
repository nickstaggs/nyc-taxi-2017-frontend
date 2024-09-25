FROM node:alpine
WORKDIR /app
COPY ./package.json ./package.json
COPY ./public ./public
COPY ./src ./src
RUN touch .env
RUN echo "REACT_APP_API_URL=http://localhost:80/api" >> .env
RUN npm install
RUN npm install react-scripts@latest -g --silent
EXPOSE 3000

CMD ["npm","start"]