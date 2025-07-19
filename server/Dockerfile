FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# This includes package.json, source code, esbuild config, etc.
COPY package*.json ./
# This copies index.ts, routes.ts, package.json, etc. into /app in the container
COPY . .

# Install ALL dependencies (dev and prod) needed for the build process
# since everything is in one stage now.
RUN npm install

# Run the build script to transpile TypeScript
# This will create dist/index.cjs
RUN npm run build

# --- Optional Debugging (remove these if you want, but useful for final confirmation) ---
RUN echo "Contents of /app/dist after build:"
RUN ls -l /app/dist
RUN echo "Contents of /app after build:"
RUN ls -l /app
# --- End Debugging ---

# Expose the port your Express app listens on
EXPOSE 3000

# Command to run your application
# The file will be at /app/dist/index.cjs from the build step
CMD [ "node", "dist/index.cjs" ]