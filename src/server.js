import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';

const app = express();

app.use(bodyParser.json());

const withDB = async (operations, response) => {
	try {
		const client = await MongoClient.connect('mongodb://localhost:27017', {
			useNewURLParser: true
		});
		const db = client.db('my-blog');

		await operations(db);

		client.close();
	} catch (error) {
		response.status(500).json({ message: 'Error connecting to db', error });
	}
};

// Get article
app.get('/api/articles/:name', async (request, response) => {
	withDB(async db => {
		const articleName = request.params.name;

		const articleInfo = await db
			.collection('articles')
			.findOne({ name: articleName });
		response.status(200).json(articleInfo);
	}, response);
});

// Add like
app.post('/api/articles/:name/like', async (request, response) => {
	withDB(async db => {
		const articleName = request.params.name;

		const articleInfo = await db
			.collection('articles')
			.findOne({ name: articleName });
		await db.collection('articles').updateOne(
			{ name: articleName },
			{
				$set: {
					likes: articleInfo.likes + 1
				}
			}
		);

		const updatedArticleInfo = await db
			.collection('articles')
			.findOne({ name: articleName });

		response.status(200).json(updatedArticleInfo);
	}, response);
});

// Add comment
app.post('/api/articles/:name/add-comment', (request, response) => {
	const { username, text } = request.body;
	const articleName = request.params.name;

	withDB(async db => {
		const articleInfo = await db
			.collection('articles')
			.findOne({ name: articleName });
		await db.collection('articles').updateOne(
			{ name: articleName },
			{
				$set: {
					comments: articleInfo.comments.concat({ username, text })
				}
			}
		);
		const updatedArticleInfo = await db
			.collection('articles')
			.findOne({ name: articleName });
		response.status(200).json(updatedArticleInfo);
	}, response);
});

app.listen(8000, () => console.log('Listening on port 8000'));
