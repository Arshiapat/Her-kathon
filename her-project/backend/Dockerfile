# Stage 1: Node environment for React + Hardhat
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Expose React frontend port
EXPOSE 3000

# Start React app
CMD ["npm", "start"]
