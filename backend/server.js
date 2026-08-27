import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = process.env.PORT || 5000;
const root = path.dirname(fileURLToPath(import.meta.url));
const dataPath = (name) => path.join(root, 'data', name);

app.use(cors());
app.use(express.json());

async function readData(name) {
  return JSON.parse(await fs.readFile(dataPath(name), 'utf8'));
}
async function writeData(name, data) {
  await fs.writeFile(dataPath(name), JSON.stringify(data, null, 2));
}

app.get('/api/products', async (req, res) => {
  const products = await readData('products.json');
  const search = String(req.query.search || '').trim().toLowerCase();
  const category = String(req.query.category || '').trim();
  const filtered = products.filter((product) => {
    const matchesSearch = !search || `${product.name} ${product.brand}`.toLowerCase().includes(search);
    const matchesCategory = !category || category === 'الكل' || product.category === category;
    return matchesSearch && matchesCategory;
  });
  res.json(filtered);
});

app.get('/api/products/:id', async (req, res) => {
  const products = await readData('products.json');
  const product = products.find((item) => item.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
  res.json(product);
});

app.post('/api/products', async (req, res) => {
  const { name, brand, category, price, image, description } = req.body;
  if (!name || !brand || !category || !price || !image || !description) {
    return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
  }
  const products = await readData('products.json');
  const product = { id: `p-${Date.now()}`, name, brand, category, price: Number(price), image, description, featured: false };
  products.unshift(product);
  await writeData('products.json', products);
  res.status(201).json(product);
});

app.get('/api/categories', async (_req, res) => res.json(await readData('categories.json')));

app.post('/api/categories', async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'اسم التصنيف مطلوب' });
  const categories = await readData('categories.json');
  if (categories.some((category) => category.name === name)) return res.status(409).json({ message: 'التصنيف موجود مسبقاً' });
  const category = { id: `c-${Date.now()}`, name };
  categories.push(category);
  await writeData('categories.json', categories);
  res.status(201).json(category);
});

app.listen(port, () => console.log(`Jofra API running at http://localhost:${port}`));
