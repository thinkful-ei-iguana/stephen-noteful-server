// const { expect } = require('chai');
// const knex = require('knex');
// const app = require('../src/app');
// // const { makeUsersArray } = require('./users.fixtures');
// // const { makeArticlesArray } = require('./articles.fixtures');

// describe('Noteful Endpoints', function () {
//   let db;

//   before('make knex instance', () => {
//     db = knex({
//       client: 'pg',
//       connection: process.env.TEST_DATABASE_URL,
//     });
//     app.set('db', db);
//   });

//   after('disconnect from db', () => db.destroy());
//   before('clean the table', () => db.raw('TRUNCATE blogful_articles, blogful_users, blogful_comments RESTART IDENTITY CASCADE'));
//   afterEach('cleanup', () => db.raw('TRUNCATE blogful_articles, blogful_users, blogful_comments RESTART IDENTITY CASCADE'));

//   describe('GET /api/articles', () => {

//     context('Given no articles', () => {
//       it('responds with 200 and an empty list', () => {
//         return supertest(app)
//           .get('/api/articles')
//           .expect(200, []);
//       });
//     });

//     context('Given there are articles in the database', () => {
//       const testUsers = makeUsersArray();
//       const testArticles = makeArticlesArray();

//       beforeEach('insert articles', () => {
//         return db
//           .into('blogful_users')
//           .insert(testUsers)
//           .then(() => {
//             return db
//               .into('blogful_articles')
//               .insert(testArticles)
//           })
//       })
//       it('GET /api/articles responds with 200 and all of the articles', () => {
//         return supertest(app)
//           .get('/api/articles')
//           .expect(200, testArticles);
//       });
//     });


//     context(`Given an XSS attack article`, () => {
//       const testUsers = makeUsersArray();
//       const maliciousArticle = {
//         id: 911,
//         title: 'Naughty naughty very naughty <script>alert("xss");</script>',
//         style: 'How-to',
//         content: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.'
//       };
//       const expectedArticle = {
//         ...maliciousArticle,
//         title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
//         content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
//       }

//       beforeEach('insert malicious article', () => {
//         return db
//           .into('blogful_users')
//           .insert(testUsers)
//           .then(() => {
//             return db
//               .into('blogful_articles')
//               .insert([maliciousArticle])
//           })
//       })

//       it('removes XSS attack content', () => {
//         return supertest(app)
//           .get(`/api/articles`)
//           .expect(200)
//           .expect(res => {
//             expect(res.body[0].title).to.eql(expectedArticle.title)
//             expect(res.body[0].content).to.eql(expectedArticle.content)
//           })
//       })
//     })
//   })

// });