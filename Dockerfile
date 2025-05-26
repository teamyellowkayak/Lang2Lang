FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy all application files needed for build and runtime
# This includes package.json, source code, esbuild config, etc.
COPY package*.json ./
COPY server ./server/
COPY shared ./shared/
COPY esbuild.config.mjs ./

# Install ALL dependencies (dev and prod) needed for the build process
# since everything is in one stage now.
RUN npm install

# Run the build script to transpile TypeScript
# This will create dist/index.cjs
RUN npm run build:backend

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