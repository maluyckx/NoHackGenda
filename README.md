# NoHackGenda

## Grade : 15/20 (second best grade of the class)

## Goal

Build up a secure online agenda and putting the only focus on **security**.

## Authors

- Luyckx Marco : 496283
- Taes Julien : 474196

## How to use/setup our project <a name="setup"></a>

### 1) Clone the repository

Clone the repository to your local machine using the following command :

```bash
$ git clone git@github.com:maluyckx/NoHackGenda.git
```

### 2) Install Docker (if you don't have it already)

If Docker is not installed on your machine, you can follow the installation instructions provided [here.](https://docs.docker.com/get-docker/)

### 3) Launch the container

Navigate to the project directory and launch the container using Docker Compose :
```bash
$ docker compose -f "docker-compose.yml" up --build
```

### 4) Enjoy your secure agenda
Open your favorite browser and go to http://localhost:8080 or simply click [here](http://localhost:8080) (we promise that it is not a Rickroll)

## Security features <a name="security_features"></a>

We have implemented various security features to ensure the safety of your data. You can find detailed information in our <a href="https://github.com/maluyckx/NoHackGenda/blob/master/report.pdf" title="report">report</a>.
