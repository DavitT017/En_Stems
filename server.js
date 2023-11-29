const express = require('express');
const session = require('express-session')
const multer = require('multer');
const app = express();
const port = 3000; // Change this to your desired port
const { exec } = require('child_process');
const fs = require('fs');
const mime = require('mime-types');
const path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(session({
  secret: '1440', // Change this to a secure secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if your server is using HTTPS
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'loading.html'));
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const usersFilePath = path.join(__dirname, 'users.json');
const localStorage = {}; // Simple in-memory storage for demonstration purposes

app.get('/signin.html', (req, res) => {
  console.log('Request received for /signin.html');
  res.sendFile(path.join(__dirname, 'signin.html'));
});

app.get('/signup.html', (req, res) => {
  console.log('Request received for /signup.html');
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.post('/signup', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate email, username, and password (you may want to add more validation)
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Invalid email, username, or password.' });
    }

    // Check if the username or email is already taken
    const users = getUsers();
    if (users.find(user => user.username === username || user.email === email)) {
      return res.status(400).json({ error: 'Username or email already taken.' });
    }

    // Hash the password (you should use bcrypt or a similar library)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the new user to the users.json file
    users.push({ email, username, password: hashedPassword });
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

    // Send the username to the client
    res.status(200).json({ message: 'User registered successfully', username });
  } catch (error) {
    console.error('Error during sign-up:', error);
    return res.status(500).json({ error: 'Sign-up failed.' });
  }
});

app.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate username and password (you may want to add more validation)

    // Check if the user exists and the password is correct
    const users = getUsers();
    const user = users.find(user => user.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Set a session with the user information
    req.session.user = { username };

    // Send the username to the client
    res.status(200).json({ message: 'User signed in successfully', username });
  } catch (error) {
    console.error('Error during sign-in:', error);
    return res.status(500).json({ error: 'Sign-in failed.' });
  }
});

app.get('/checkSignIn', (req, res) => {
  const username = req.session.user ? req.session.user.username : null;
  if (username) {
    res.json({ username });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.post('/signout', (req, res) => {
  try {
    // Sessian em maqrum
    currentUsername = null;
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        res.status(500).json({ error: 'Sign-out failed.' });
      } else {
        res.status(200).json({ message: 'Sign out successful' });
      }
    });
  } catch (error) {
    console.error('Error during sign-out:', error);
    res.status(500).json({ error: 'Sign-out failed.' });
  }
});

app.post('/separate-audio', upload.single('audio'), async (req, res) => {
  try {
    const audioFilePath = req.file.path;
    const outputFormat = req.body.format;
    const selectedStem = req.body.stem;

    let outputDir;
    if (selectedStem === '2stems') {
      outputDir = 'output_2stems';
    } else if (selectedStem === '4stems') {
      outputDir = 'output_4stems';
    } else if (selectedStem === '5stems') {
      outputDir = 'output_5stems';
    } else {
      throw new Error('Invalid stem configuration.');
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const command = `spleeter separate -p spleeter:${selectedStem} -o ${outputDir} ${audioFilePath}`;
    console.log('Executing command:', command);

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.log('Command Output:', stdout);
        console.error('Command Error:', stderr);
        console.error('Error during audio separation:', error);
        res.status(500).json({ error: 'Audio separation failed.' });
        return;
      }

      fs.unlinkSync(audioFilePath);

      const separatedStems = stdout
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.replace('INFO:spleeter:File ', '').split(' written succesfully')[0].trim());

      res.json({ stems: separatedStems });
    });
  } catch (error) {
    console.error('Error during audio separation:', error);
    res.status(500).json({ error: 'Audio separation failed.' });
  }
});

app.get('/play', (req, res) => {
  const filePath = req.query.file;

  if (fs.existsSync(filePath)) {
    const contentType = mime.lookup(filePath);
    res.setHeader('Content-Type', contentType);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    res.status(404).send('File not found.');
  }
});

app.get('/download', (req, res) => {
  const filePath = req.query.file;

  if (fs.existsSync(filePath)) {
    const contentType = mime.lookup(filePath);
    res.setHeader('Content-Type', contentType);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    res.status(404).send('File not found.');
  }
});

function getUsers() {
  try {
    const usersData = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(usersData);
  } catch (error) {
    // Handle file read error or return an empty array
    return [];
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});