import { getPublishedProjects } from './src/services/projects'
getPublishedProjects().then(r => {
  console.log(r.length)
  process.exit(0)
}).catch(e => {
  console.error(e)
  process.exit(1)
})
