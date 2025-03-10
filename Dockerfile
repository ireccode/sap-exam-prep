# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install


# Access secrets securely during build
RUN --mount=type=secret,id=VITE_SUPABASE_URL \
    --mount=type=secret,id=VITE_SUPABASE_ANON_KEY \
    --mount=type=secret,id=VITE_STRIPE_PUBLISHABLE_KEY \
    --mount=type=secret,id=VITE_STRIPE_PREMIUM_PRICE_ID \
    --mount=type=secret,id=VITE_BASIC_ENCRYPTION_KEY \
    --mount=type=secret,id=VITE_PREMIUM_ENCRYPTION_KEY \
    --mount=type=secret,id=VITE_WEBHOOK_SECRET \
    --mount=type=secret,id=VITE_OPENROUTER_API_KEY \
    echo "VITE_SUPABASE_URL: $(cat  /Users/irec/.docker/run/secrets/VITE_SUPABASE_URL)" > .env && \
    echo "VITE_SUPABASE_ANON_KEY: $(cat  /Users/irec/.docker/run/secrets/VITE_SUPABASE_ANON_KEY)" >> .env && \
    echo "VITE_STRIPE_PUBLISHABLE_KEY: $(cat  /Users/irec/.docker/run/secrets/VITE_STRIPE_PUBLISHABLE_KEY)" >> .env && \
    echo "VITE_STRIPE_PREMIUM_PRICE_ID: $(cat  /Users/irec/.docker/run/secrets/VITE_STRIPE_PREMIUM_PRICE_ID)" >> .env && \
    echo "VITE_BASIC_ENCRYPTION_KEY: $(cat  /Users/irec/.docker/run/secrets/VITE_BASIC_ENCRYPTION_KEY)" >> .env && \
    echo "VITE_PREMIUM_ENCRYPTION_KEY: $(cat  /Users/irec/.docker/run/secrets/VITE_PREMIUM_ENCRYPTION_KEY)" >> .env && \
    echo "VITE_WEBHOOK_SECRET: $(cat  /Users/irec/.docker/run/secrets/VITE_WEBHOOK_SECRET)" >> .env && \
    echo "VITE_OPENROUTER_API_KEY: $(cat  /Users/irec/.docker/run/secrets/VITE_OPENROUTER_API_KEY)" >> .env $$ \
    echo "content of .env: $(cat .env)" 


# Copy source code and build
COPY . .
RUN npm run build

# Debug: Show copied files after build
RUN echo "Public files after build:" && \
    find dist -type f -name "*.encrypted" -o -name "*.template" -o -name "*.jpg" -o -name "*.png" -o -name "*.json"  -o -name "*.js"  -o -name "*.css"

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only the built files from build stage
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package*.json ./
# Copy built assets from build stage (all at once)
COPY --from=build /app/dist/ /usr/share/nginx/html/

# Install only production dependencies
RUN npm ci --production

# Install serve to run the static files
RUN npm install -g serve@14.2.1

# Create directory for secrets
RUN mkdir -p /run/secrets

# Create startup script
RUN echo 'const fs = require("fs");' > /start.js && \
    echo 'const { execSync } = require("child_process");' >> /start.js && \
    echo 'console.log("Loading environment variables from secret files...");' >> /start.js && \
    echo 'Object.keys(process.env).forEach(key => {' >> /start.js && \
    echo '  if (key.endsWith("_FILE")) {' >> /start.js && \
    echo '    const envKey = key.slice(0, -5);  // Remove _FILE suffix' >> /start.js && \
    echo '    try {' >> /start.js && \
    echo '      const value = fs.readFileSync(process.env[key], "utf8").trim();' >> /start.js && \
    echo '      process.env[envKey] = value;' >> /start.js && \
    echo '      console.log(`${envKey} loaded from ${process.env[key]}`);' >> /start.js && \
    echo '    } catch (error) {' >> /start.js && \
    echo '      console.warn(`Warning: Could not load ${envKey} from ${process.env[key]}: ${error.message}`);' >> /start.js && \
    echo '    }' >> /start.js && \
    echo '  }' >> /start.js && \
    echo '});' >> /start.js && \
    echo 'console.log("Environment variables loaded:");' >> /start.js && \
    echo 'Object.keys(process.env).filter(key => key.startsWith("VITE_") && !key.endsWith("_FILE")).forEach(key => {' >> /start.js && \
    echo '  console.log(`${key}=${process.env[key]}`);' >> /start.js && \
    echo '});' >> /start.js && \
    echo 'console.log("Starting server...");' >> /start.js && \
    echo 'execSync("serve -s dist -l 5173 --cors --single", { stdio: "inherit" });' >> /start.js

# Expose port
EXPOSE 5173

# Start the application using the Node.js startup script
CMD ["node", "/start.js"] 