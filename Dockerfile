# syntax=docker/dockerfile:1
FROM ruby:2.7.6 AS dm2-dev

# Install node.js and yarn
RUN apt-get update -qq && apt-get install -y curl sudo
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
RUN apt-get install -y nodejs
RUN npm install -g yarn

# Install bundler and API
ENV INSTALL_PATH /opt/app
RUN mkdir -p $INSTALL_PATH
WORKDIR $INSTALL_PATH
COPY . $INSTALL_PATH
RUN gem install bundler
RUN bundle install

# Add a script to be executed every time the container starts
COPY entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
EXPOSE 443
EXPOSE 3000
EXPOSE 3001

# Install frontend
WORKDIR $INSTALL_PATH/client
RUN yarn install && NODE_OPTIONS="--max_old_space_size=2560" yarn build-craco
WORKDIR $INSTALL_PATH
RUN cp -a $INSTALL_PATH/client/build/. $INSTALL_PATH/public/
RUN yarn deploy

# Run shell
CMD ["/bin/sh"]