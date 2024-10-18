const express = require('express');
const https = require('https');
const app = express();


app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(express.static('public'));
app.engine("ejs",require("ejs").renderFile);
app.set("view engine","ejs");

let datosSuperheroes = null; // Variable para almacenar los datos de los superheroes y no repetir peticiones a la API

app.get('/', (req, res) => {
    const itemsPerPage = 12; // Número de superhéroes por página
    const currentPage = parseInt(req.query.page) || 1; // Página actual, por defecto 1
  
    // Si ya tenemos los datos en caché, los usamos
    if (datosSuperheroes) {
      console.log('Usando datos en caché');
      
      // Cálculo de los índices para los superhéroes que se van a mostrar
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = currentPage * itemsPerPage;
      const superheroesToShow = datosSuperheroes.slice(startIndex, endIndex); // Seleccionar los héroes para esta página
      
      const totalPages = Math.ceil(datosSuperheroes.length / itemsPerPage); // Total de páginas
  
      // Renderizamos la vista 'home' con los datos filtrados para la página actual
      res.render('home', {
        superheroes: superheroesToShow,
        currentPage,
        totalPages
      });
    } else {
      console.log('Haciendo la petición a la API');
      https.get('https://akabab.github.io/superhero-api/api/all.json', (apiRes) => {
        let data = '';
    
        apiRes.on('data', chunk => {
          data += chunk;
        });
    
        apiRes.on('end', () => {
          try {
            const superheroes = JSON.parse(data);
            datosSuperheroes = superheroes; // Guardamos los datos en caché
  
            // Cálculo de los índices para los superhéroes que se van a mostrar
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = currentPage * itemsPerPage;
            const superheroesToShow = superheroes.slice(startIndex, endIndex);
    
            const totalPages = Math.ceil(superheroes.length / itemsPerPage);
  
            // Renderizamos la vista con los datos de la página actual
            res.render('home', {
              superheroes: superheroesToShow,
              currentPage,
              totalPages
            });
          } catch (error) {
            console.error('Error al parsear los datos:', error);
            res.status(500).send('Error al procesar los datos');
          }
        });
    
      }).on('error', (error) => {
        console.error('Error al hacer la petición HTTPS:', error.message);
        res.status(500).send('Error al obtener los datos');
      });
    }
  });

  app.get('/hero/:id', (req, res) => {
    const heroId = parseInt(req.params.id);

    // Buscar el héroe actual por su id
    const currentHeroIndex = datosSuperheroes.findIndex(h => h.id === heroId);

    if (currentHeroIndex === -1) {
        return res.status(404).send('Superhéroe no encontrado');
    }

    const currentHero = datosSuperheroes[currentHeroIndex];

    // Encontrar el héroe anterior
    let previousHeroIndex = currentHeroIndex - 1;
    while (previousHeroIndex < 0 || !datosSuperheroes[previousHeroIndex]) {
        previousHeroIndex = (previousHeroIndex + datosSuperheroes.length) % datosSuperheroes.length;
    }

    const previousHero = datosSuperheroes[previousHeroIndex];

    // Encontrar el héroe siguiente
    let nextHeroIndex = currentHeroIndex + 1;
    while (nextHeroIndex >= datosSuperheroes.length || !datosSuperheroes[nextHeroIndex]) {
        nextHeroIndex = (nextHeroIndex + datosSuperheroes.length) % datosSuperheroes.length;
    }

    const nextHero = datosSuperheroes[nextHeroIndex];

    // Renderizar la vista heroDetail con los héroes actual, anterior y siguiente
    res.render('superheroe', {
        hero: currentHero,
        nextHeroId: nextHero.id,
        previousHeroId: previousHero.id
    });
});

app.get('/search', (req, res) => {
    const query = req.query.query.toLowerCase();  // Convertimos la búsqueda a minúsculas
  
    // Función para normalizar los nombres eliminando guiones, espacios y otros caracteres especiales
    const normalizeString = (str) => {
      return str.toLowerCase().replace(/[-\s]/g, '');  // Eliminamos guiones y espacios, y convertimos a minúsculas
    };
  
    // Filtrar los superhéroes usando la función de normalización
    const filteredHeroes = datosSuperheroes.filter(hero => {
      return normalizeString(hero.name).includes(normalizeString(query));
    });
  
    if (filteredHeroes.length > 0) {
      // Si se encuentran héroes, renderiza la vista de resultados
      res.render('searchResults', { heroes: filteredHeroes, query });
    } else {
      // Si no se encuentran héroes, renderiza una vista con un mensaje de "no resultados"
      res.render('searchResults', { heroes: [], query });
    }
  });

app.listen(3010, ()=>{
    console.log('Server is running on port 3010');
});