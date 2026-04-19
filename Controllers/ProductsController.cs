using InventoryHub.Models;
using Microsoft.AspNetCore.Mvc;

namespace InventoryHub.Controllers;

[ApiController]
[Route("products")]
public class ProductsController : ControllerBase
{
    private static readonly List<Product> Products = new()
    {
        new Product { Id = 1, Name = "Notebook", Price = 4.99m, Quantity = 25 },
        new Product { Id = 2, Name = "Pen", Price = 1.25m, Quantity = 100 }
    };

    private static readonly object ProductsLock = new();
    private static int NextId = 3;

    [HttpGet]
    public ActionResult<IEnumerable<Product>> GetAll()
    {
        lock (ProductsLock)
        {
            return Ok(Products.Select(CloneProduct).ToList());
        }
    }

    [HttpGet("{id:int}")]
    public ActionResult<Product> GetById(int id)
    {
        lock (ProductsLock)
        {
            var product = Products.FirstOrDefault(currentProduct => currentProduct.Id == id);

            if (product is null)
            {
                return NotFound(new { message = $"Product with id {id} was not found." });
            }

            return Ok(CloneProduct(product));
        }
    }

    [HttpPost]
    public ActionResult<Product> Create([FromBody] Product product)
    {
        var validationError = ValidateProduct(product);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        lock (ProductsLock)
        {
            var newProduct = new Product
            {
                Id = NextId++,
                Name = product.Name.Trim(),
                Price = product.Price,
                Quantity = product.Quantity
            };

            Products.Add(newProduct);
            return CreatedAtAction(nameof(GetById), new { id = newProduct.Id }, newProduct);
        }
    }

    [HttpPut("{id:int}")]
    public ActionResult<Product> Update(int id, [FromBody] Product product)
    {
        var validationError = ValidateProduct(product);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        lock (ProductsLock)
        {
            var existingProduct = Products.FirstOrDefault(currentProduct => currentProduct.Id == id);

            if (existingProduct is null)
            {
                return NotFound(new { message = $"Product with id {id} was not found." });
            }

            existingProduct.Name = product.Name.Trim();
            existingProduct.Price = product.Price;
            existingProduct.Quantity = product.Quantity;

            return Ok(CloneProduct(existingProduct));
        }
    }

    [HttpDelete("{id:int}")]
    public ActionResult<Product> Delete(int id)
    {
        lock (ProductsLock)
        {
            var product = Products.FirstOrDefault(currentProduct => currentProduct.Id == id);

            if (product is null)
            {
                return NotFound(new { message = $"Product with id {id} was not found." });
            }

            Products.Remove(product);
            return Ok(CloneProduct(product));
        }
    }

    private static string? ValidateProduct(Product product)
    {
        if (product is null)
        {
            return "Request body is required.";
        }

        if (string.IsNullOrWhiteSpace(product.Name))
        {
            return "Name is required.";
        }

        if (product.Price <= 0)
        {
            return "Price must be greater than 0.";
        }

        if (product.Quantity < 0)
        {
            return "Quantity must not be negative.";
        }

        return null;
    }

    private static Product CloneProduct(Product product)
    {
        return new Product
        {
            Id = product.Id,
            Name = product.Name,
            Price = product.Price,
            Quantity = product.Quantity
        };
    }
}
