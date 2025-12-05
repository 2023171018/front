const express = require('express');
const path = require('path');

const app = express();

// Servir archivos estáticos desde la carpeta dist
app.use(express.static(path.join(__dirname, 'dist/juce-pwa/browser')));

// Redirigir todas las rutas a index.html para que Angular Router maneje la navegación
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/juce-pwa/browser/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
