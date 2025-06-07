import { Meteor } from 'meteor/meteor';
import '../imports/api/collections.js';
import '../imports/api/methods.js';

Meteor.startup(() => {
  console.log('RankRoom Meteor server started');
  
  // Set up any server-side initialization here
  // For example, create default data, configure services, etc.
});