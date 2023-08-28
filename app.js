const express = require('express')
const crypto = require('node:crypto')
const moviesJSON = require('./movies.json')
const cors = require('cors')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.disable('x-powered-by')
app.use(express.json())
app.use(cors())

// métodos normales: GET/HEAD/POST
// métodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight
// OPTIONS

// const ACCEPTED_ORIGINS = [
//   'http://localhost:8080',
//   'http://localhost:1234',
//   'https://movies.com',
//   'https://midu.dev'
// ]

app.get('/movies', (req, res) => {
  // indicar que el recurso puede ser accedido desde cualquier sitio
  // de esta forma se evita el problema del CORS

  // const origin = req.header('origin')

  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header('Access-Control-Allow-Origin', origin) // -> el * indica que todos los sitios pueden acceder
  // } comentado porque usamos el middleware de cors

  const { genre } = req.query
  if (genre) {
    const filteredMovies = moviesJSON.filter(
      movie => movie.genre.some(g => g.toLocaleLowerCase() === genre.toLocaleLowerCase())
    )
    return res.json(filteredMovies)
  }
  res.json(moviesJSON)
})

app.get('/movies/:id', (req, res) => { // path to regexp puede utilizarse aquí
  const { id } = req.params
  const movie = moviesJSON.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    // 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }

  // Esto no sería REST por que estámos guardando el estado de la aplicación en memoria
  moviesJSON.push(newMovie)

  res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
  // const origin = req.header('origin')

  //   if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //     res.header('Acess-Controll-Allow-Origin', origin)
  //     res.header('Acess-Controll-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  //   }
  const { id } = req.params
  const movieIndex = moviesJSON.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  moviesJSON.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = moviesJSON.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not  found!' })
  }

  const updatedMovie = {
    ...moviesJSON[movieIndex],
    ...result.data
  }

  moviesJSON[movieIndex] = updatedMovie

  return res.json(updatedMovie)
})

// app.options('/movies/:id', (req, res) => {
//   const origin = req.header('origin')

//   if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
//     res.header('Acess-Controll-Allow-Origin', origin)
//     res.header('Acess-Controll-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
//   }

//   res.sendStatus(200)
// })

app.use((req, res) => {
  res.status(404).send('<h1>Not found</h1>')
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => console.log(`Server listening on port: http://localhost:${PORT}`))
