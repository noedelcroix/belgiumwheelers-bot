FROM node
ENV NODE_ENV=production
WORKDIR /project
COPY . /project/
RUN npm install

CMD [ "node", "." ]