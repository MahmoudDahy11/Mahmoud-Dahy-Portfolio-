import { getPublishedProjects } from './src/services/projects'
getPublishedProjects().then(r => {
  console.log(r.length)
  if (r[0]) {
    console.log(r[0].title)
    console.log(r[0].technologies?.map(t=>t.name))
  }
  process.exit(0)
})
