FROM node:20-alpine

WORKDIR /app

# Instalar librerías nativas necesarias para Prisma en Alpine Linux
RUN apk add --no-cache openssl libc6-compat

# Copiamos descriptores de dependencias y la carpeta prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instalamos dependencias del proyecto
RUN npm install

# Copiamos todo el código fuente del backend
COPY . .

# Generamos el cliente de Prisma para el entorno Linux
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]