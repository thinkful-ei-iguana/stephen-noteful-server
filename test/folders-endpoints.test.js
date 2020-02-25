const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeFoldersArray, makeNotesArray } = require('./noteful.fixtures');

describe('Noteful Endpoints', function () {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });

    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  before('clean the table', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'));
  afterEach('cleanup', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'));

  describe('GET /api/folders', () => {

    context('Given no folders', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, []);
      });
    });

    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();

      beforeEach('insert folder', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
      })
      it('GET /api/folders responds with 200 and all of the folders', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, testFolders);
      });
    });


    context(`Given an XSS attack folder`, () => {

      const maliciousFolder = {
        id: 911,
        folder_name: 'Naughty naughty very naughty <script>alert("xss");</script>',

      };
      const expectedFolder = {
        ...maliciousFolder,
        folder_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',

      }

      beforeEach('insert malicious folder', () => {
        return db
          .into('noteful_folders')
          .insert(maliciousFolder)
      })

      it('removes XSS attack folder_name', () => {
        return supertest(app)
          .get(`/api/folders`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].folder_name).to.eql(expectedFolder.folder_name)
          })
      })
    })
  })

  describe('GET /api/folders/:folder_id', () => {
    context('Given no folders', () => {
      it('responds with 404', () => {
        const folderid = 123456;
        return supertest(app)
          .get(`/api/folders/${folderid}`)
          .expect(404, { error: { message: 'Folder doesn\'t exist!' } });
      });
    });

    context('Given there are Folders in the database', () => {
      context('Given an XSS attack Folder', () => {
        const maliciousFolder = {
          id: 911,
          folder_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        };

        beforeEach('insert malicious folder', () => {
          return db
            .into('noteful_folders')
            .insert(maliciousFolder)
        });

        it('removes XSS attack folder_name', () => {
          return supertest(app)
            .get(`/api/folders/${maliciousFolder.id}`)
            .expect(200)
            .expect(res => {
              expect(res.body.folder_name).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
            });
        });
      });

      const testFolders = makeFoldersArray();
      // const testArticles = makeNotesArray();

      beforeEach('insert folders', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
      });

      it('responds with 200 and the specified folder', () => {
        const folderId = 2;
        const expectedFolder = testFolders[folderId - 1];
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(200, expectedFolder);
      });
    });
  });

  describe('POST /api/folders', () => {
    // const testFolders = makeFoldersArray();
    // beforeEach('insert malicious folder', () => {
    //   return db
    //     .into('noteful_folders')
    //     .insert(testFolders)
    // })

    it('creates a folder, responding with 201 and the new folder', function () {
      this.retries(3);
      const newFolder = {
        folder_name: 'Testy'
      };
      return supertest(app)
        .post('/api/folders')
        .send(newFolder)
        .expect(201)
        .expect(res => {
          expect(res.body.folder_name).to.eql(newFolder.folder_name);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/folders/${postRes.body.id}`)
            .expect(postRes.body)
        );
    });

    const requiredFields = ['folder_name'];

    requiredFields.forEach(field => {
      const newFolder = {
        folder_name: 'Test new folder'
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newFolder[field];

        return supertest(app)
          .post('/api/folders')
          .send(newFolder)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          });
      });
    });

    it('removes XSS attack content from response', () => {
      const maliciousFolder = {
        id: 911,
        folder_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
      };
      const expectedFolder = {
        ...maliciousFolder,
        folder_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
      }
      return supertest(app)
        .post('/api/folders')
        .send(maliciousFolder)
        .expect(201)
        .expect(res => {
          expect(res.body.folder_name).to.eql(expectedFolder.folder_name);
        });
    });
  });

  describe(`DELETE /api/folders/:folder_id`, () => {

    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderid = 123456;
        return supertest(app)
          .delete(`/api/folders/${folderid}`)
          .expect(404, { error: { message: `Folder doesn't exist!` } });
      });
    });
    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray();

      beforeEach('insert folders', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
      })

      it('responds with 204 and removes the folder', () => {
        const idToRemove = 2;
        const expectedFolder = testFolders.filter(folder => folder.id !== idToRemove);
        return supertest(app)
          .delete(`/api/folders/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/folders`)
              .expect(expectedFolder)
          );
      });
    });
  });

  describe(`PATCH /api/folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderid = 123456;
        return supertest(app)
          .patch(`/api/folders/${folderid}`)
          .expect(404, { error: { message: `Folder doesn't exist!` } });
      });
    });

    context('Given there are Folders in the database', () => {
      const testFolders = makeFoldersArray();
      beforeEach('insert folders', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
      })

      it('responds with 204 and updates the folder', () => {
        const idToUpdate = 2;
        const updateFolder = {
          folder_name: 'updated folder title',
        };
        const expectedFolder = {
          ...testFolders[idToUpdate - 1],
          ...updateFolder
        };
        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send(updateFolder)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/folders/${idToUpdate}`)
              .expect(expectedFolder)
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain a folder_name`
            }
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updateFolder = {
          folder_name: 'updated folder name',
        }
        const expectedFolder = {
          ...testFolders[idToUpdate - 1],
          ...updateFolder
        }

        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send({
            ...updateFolder,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/folders/${idToUpdate}`)
              .expect(expectedFolder)
          );
      });

    });

  });

});