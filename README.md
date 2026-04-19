# InventoryHub

InventoryHub is a simple full-stack sample that uses:

- ASP.NET Core Web API for the backend
- In-memory storage with a `List<Product>`
- HTML, CSS, and JavaScript for the frontend
- `fetch()` for API calls

## Run the app

1. Install the .NET 8 SDK.
2. Run the project from the workspace root:

```bash
dotnet run
```

3. Open `http://localhost:5050` in your browser.

## API endpoints

- `GET /products` - get all products
- `GET /products/{id}` - get one product by ID
- `POST /products` - add a new product
- `PUT /products/{id}` - update a product
- `DELETE /products/{id}` - delete a product

## Example request and response

### Create a product

Request:

```json
{
  "name": "Wireless Mouse",
  "price": 24.99,
  "quantity": 15
}
```

Response:

```json
{
  "id": 3,
  "name": "Wireless Mouse",
  "price": 24.99,
  "quantity": 15
}
```

### Validation error example

```json
{
  "message": "Price must be greater than 0."
}
```
