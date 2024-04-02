# mdb_pdb_extract

To extract HTMLs to sqlite database:

Build docker:

```
docker build -t mdb_pdb_extract .
```

Run:
```
docker run -it -v ./test:/inputs -v ./db:/usr/src/app/db mdb_pdb_extract add_to_sqlite.js /inputs
```

Where `./test` is a directory on system with HTML files and `./db` is resulting database folder location.