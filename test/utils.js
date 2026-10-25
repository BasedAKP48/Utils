const utils = require('../');
const expect = require('unexpected');

describe('Utils', () => {
  describe('safeObject', () => {
    const blankObject = {};
    const dirtyObject = {
      '/dirtykey': true,
      'other[dirtykey]': true,
      cleanKey: true,
    };
    const cleanObject = {
      cleanKey1: true,
      cleanKey2: true,
      cleanKey3: false,
    };
    const cleanedObject = {
      '|dirtykey': true,
      'other|dirtykey|': true,
      cleanKey: true,
    };

    it('Should be the same empty object', () => {
      expect(utils.safeObject(blankObject), 'to be', blankObject);
    });

    it('Should be the same clean object', () => {
      expect(utils.safeObject(cleanObject), 'to be', cleanObject);
    });

    it('Should not be dirty', () => {
      expect(utils.safeObject(dirtyObject), 'not to be', dirtyObject);
    });

    it('Should be a cleaned object', () => {
      expect(utils.safeObject(dirtyObject), 'to exhaustively satisfy', cleanedObject);
    });
  });

  describe('safeString', () => {
    const cleanString = '-L1voea_NjTN8H36e8px';
    const dirtyString = '@basedakp48/plugin-utils';
    const cleanedString = '@basedakp48|plugin-utils';

    it('Should be the same clean string', () => {
      expect(utils.safeString(cleanString), 'to be', cleanString);
    });

    it('Should be a cleaned string', () => {
      expect(utils.safeString(dirtyString), 'to be', cleanedString);
    });
  });

  describe('getReply', () => {
    it('Should have the original channel');
    it('Should use our UID');
    it('Should have this text');
    it('Should copy data');
    it('Should be directed out');
    it('Should be an awesome reply');
  });

  describe('initialize', () => {
    const serviceAccount = { project_id: 'test-project' };
    const envKeys = ['GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT', 'FIREBASE_DATABASE_URL'];
    let saved;
    let calls;
    let firebase;

    beforeEach(() => {
      saved = {};
      envKeys.forEach((key) => {
        saved[key] = process.env[key];
        delete process.env[key];
      });
      calls = [];
      firebase = {
        apps: [],
        credential: {
          cert: account => ({ cert: account }),
          applicationDefault: () => ({ applicationDefault: true }),
        },
        initializeApp: (options, name) => calls.push({ options, name }),
      };
    });

    afterEach(() => {
      envKeys.forEach((key) => {
        if (saved[key] === undefined) delete process.env[key];
        else process.env[key] = saved[key];
      });
    });

    it('Should use the service account when provided', () => {
      utils.initialize(serviceAccount, 'app', firebase);
      expect(calls, 'to have length', 1);
      expect(calls[0].name, 'to be', 'app');
      expect(calls[0].options, 'to satisfy', {
        credential: { cert: serviceAccount },
        projectId: 'test-project',
        databaseURL: 'https://test-project.firebaseio.com',
      });
    });

    it('Should fall back to application default credentials', () => {
      process.env.GOOGLE_CLOUD_PROJECT = 'env-project';
      utils.initialize(undefined, undefined, firebase);
      expect(calls[0].options, 'to satisfy', {
        credential: { applicationDefault: true },
        projectId: 'env-project',
        databaseURL: 'https://env-project.firebaseio.com',
      });
    });

    it('Should accept GCLOUD_PROJECT as the project', () => {
      process.env.GCLOUD_PROJECT = 'legacy-project';
      utils.initialize(undefined, undefined, firebase);
      expect(calls[0].options.projectId, 'to be', 'legacy-project');
    });

    it('Should allow the database url to be overridden', () => {
      process.env.FIREBASE_DATABASE_URL = 'https://custom-default-rtdb.firebaseio.com';
      utils.initialize(serviceAccount, undefined, firebase);
      expect(calls[0].options.databaseURL, 'to be', 'https://custom-default-rtdb.firebaseio.com');
    });

    it('Should throw when no service account and no project are available', () => {
      expect(() => utils.initialize(undefined, undefined, firebase), 'to throw');
      expect(calls, 'to have length', 0);
    });

    it('Should not initialize twice', () => {
      firebase.apps.push({});
      utils.initialize(serviceAccount, undefined, firebase);
      expect(calls, 'to have length', 0);
    });
  });

  describe('ensureRequired', () => {
    it('Should be copied to here');
  });

  describe('sendMessage', () => {
    it('Should have tests written');
  });
});

