## copying the .env.example file to .env file

|-- create a dev.env file in the root directory
|-- copy .env.example to .env
|-- add values to the env variables

## Table of Contents

- [Project Structure](#project-structure)
<!-- - [Error Handling](#error-handling)
- [Logging](#logging) -->


## Project Structure

```
src\
 |--api
     |--controllers\  # Route controllers (controllers layer)
     |--helpers\      # Contains helper files
     |--middlewares\  # Custom express middlewares
     |--models\       # Mongoose models (data layer)
     |--routes\       # Routes
 |--config\           # Envoriment variables and configuration related things
 |--db\               # Database connection
 |--app.js            # Express app
 |--index.js          # App entry point

```

# Use these

 - solving the nested populate problem - [link](https://www.mongodb.com/community/forums/t/populate-a-nested-schema-with-model-having-nested-schema-in-mongoose/10553)

 - make a cleanBrewingItem endpoint which cleans the jobs after execution
 
 - improve the moveProductM endpoint by checking for already existing products in the inventory, problem is expiry dates might clash

 - make a dispatchOrder endpoint more technical by changing the way of speed and distance input
