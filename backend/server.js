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
app.use(express.json({ limit: '15mb' }));

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
    const matchesCategory = !category || category === 'الكل' || product.brand === category;
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
  const { name, brand, category, price, image, images, description } = req.body;
  const productImages = Array.isArray(images) && images.length ? images : [image];
  if (!name || !brand || !category || !price || !productImages[0] || !description) {
    return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
  }
  const products = await readData('products.json');
  const product = { id: `p-${Date.now()}`, name, brand, category, price: Number(price), image: productImages[0], images: productImages, description, featured: false };
  products.unshift(product);
  await writeData('products.json', products);
  res.status(201).json(product);
});

app.delete('/api/products/:id', async (req, res) => {
  const products = await readData('products.json');
  const remaining = products.filter((product) => product.id !== req.params.id);
  if (remaining.length === products.length) return res.status(404).json({ message: 'المنتج غير موجود' });
  await writeData('products.json', remaining);
  res.json({ message: 'تم حذف المنتج' });
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

app.delete('/api/categories/:id', async (req, res) => {
  const categories = await readData('categories.json');
  const category = categories.find((item) => item.id === req.params.id);
  if (!category || category.name === 'الكل') return res.status(404).json({ message: 'التصنيف غير موجود' });
  const remaining = categories.filter((item) => item.id !== req.params.id);
  await writeData('categories.json', remaining);
  res.json({ message: 'تم حذف التصنيف' });
});

app.listen(port, () => console.log(`Jofra API running at http://localhost:${port}`));
