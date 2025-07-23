# Use Node base image
FROM node:18

# Set working directory
WORKDIR /app

# Install dependencies and build
COPY ai-interviewsim/package*.json ./
RUN npm install

COPY ai-interviewsim/ .
RUN npm run build

# Serve with a simple static server
RUN npm install -g serve

EXPOSE 3000
CMD ["serve", "-s", "dist"]
