function makeFoldersArray() {
  return [
    {
      id: 1,
      folder_name: 'Things to Eat',
    },
    {
      id: 2,
      folder_name: 'Favorite Sports',
    },
    {
      id: 3,
      folder_name: 'Hobbies',
    },
  ];
}


function makeNotesArray() {
  return [
    {
      id: 1,
      note_name: 'Chicken',
      modified: '2019-01-03T05:00:00.000Z',
      content: 'Mmmm...Chicken!',
      folderid: 1
    },
    {
      id: 2,
      note_name: 'Boxing',
      modified: '2019-01-03T05:00:00.000Z',
      content: 'What a knock-out!',
      folderid: 2
    },
    {
      id: 3,
      note_name: 'Gaming',
      modified: '2019-01-03T05:00:00.000Z',
      content: 'Apex Legends, ALL day!',
      folderid: 3
    },
  ];
}

module.exports = {
  makeFoldersArray,
  makeNotesArray
};