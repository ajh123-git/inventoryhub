const apiBaseUrl = '/products';
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

const elements = {
  form: document.getElementById('productForm'),
  productId: document.getElementById('productId'),
  name: document.getElementById('name'),
  price: document.getElementById('price'),
  quantity: document.getElementById('quantity'),
  submitButton: document.getElementById('submitButton'),
  cancelButton: document.getElementById('cancelButton'),
  formTitle: document.getElementById('formTitle'),
  formMessage: document.getElementById('formMessage'),
  productCount: document.getElementById('productCount'),
  statusText: document.getElementById('statusText'),
  tableBody: document.getElementById('productTableBody')
};

let products = [];
let editingProductId = null;

initializeApp();

function initializeApp() {
  elements.form.addEventListener('submit', handleFormSubmit);
  elements.cancelButton.addEventListener('click', resetForm);
  elements.tableBody.addEventListener('click', handleTableClick);
  loadProducts();
}

async function loadProducts() {
  setTableState('Loading products...', false);

  try {
    const response = await fetch(apiBaseUrl, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const data = await response.json();
    products = Array.isArray(data) ? data : [];
    renderProducts();
    setTableState(
      products.length > 0 ? `Showing ${products.length} products.` : 'No products yet. Add the first one using the form.',
      false
    );
  } catch (error) {
    products = [];
    renderTableError(error.message || 'Unable to load products.');
    setFormMessage(error.message || 'Unable to load products.', 'error');
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();
  clearFormMessage();

  const name = elements.name.value.trim();
  const price = Number(elements.price.value);
  const quantity = Number(elements.quantity.value);
  const validationError = validateProduct(name, price, quantity);

  if (validationError) {
    setFormMessage(validationError, 'error');
    return;
  }

  const requestBody = {
    name,
    price,
    quantity
  };

  const isEditMode = editingProductId !== null;
  const requestUrl = isEditMode ? `${apiBaseUrl}/${editingProductId}` : apiBaseUrl;
  const requestMethod = isEditMode ? 'PUT' : 'POST';

  setSubmitButtonState(true, isEditMode ? 'Updating...' : 'Saving...');
  setFormMessage(isEditMode ? 'Updating product...' : 'Saving product...', 'info');

  try {
    const response = await fetch(requestUrl, {
      method: requestMethod,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const savedProduct = await response.json();

    if (isEditMode) {
      products = products.map((product) => (product.id === savedProduct.id ? savedProduct : product));
    } else {
      products = [...products, savedProduct];
    }

    renderProducts();
    resetForm();

    if (isEditMode) {
      setFormMessage('Product updated successfully.', 'success');
    } else {
      setFormMessage('Product added successfully.', 'success');
    }
  } catch (error) {
    setFormMessage(error.message || 'The request failed.', 'error');
  } finally {
    setSubmitButtonState(false, editingProductId === null ? 'Save Product' : 'Update Product');
  }
}

function handleTableClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const productId = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === 'edit') {
    startEdit(productId);
    return;
  }

  if (action === 'delete') {
    deleteProduct(productId);
  }
}

function startEdit(productId) {
  const product = products.find((currentProduct) => currentProduct.id === productId);

  if (!product) {
    setFormMessage('The selected product no longer exists.', 'error');
    return;
  }

  editingProductId = product.id;
  elements.productId.value = product.id;
  elements.name.value = product.name;
  elements.price.value = product.price;
  elements.quantity.value = product.quantity;
  elements.formTitle.textContent = 'Update Product';
  elements.submitButton.textContent = 'Update Product';
  elements.cancelButton.classList.remove('hidden');
  setFormMessage(`Editing ${product.name}.`, 'info');
  elements.name.focus();
}

async function deleteProduct(productId) {
  const product = products.find((currentProduct) => currentProduct.id === productId);
  const productName = product ? product.name : 'this product';

  if (!window.confirm(`Delete ${productName}?`)) {
    return;
  }

  setFormMessage('Deleting product...', 'info');

  try {
    const response = await fetch(`${apiBaseUrl}/${productId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const deletedProduct = await response.json();
    products = products.filter((currentProduct) => currentProduct.id !== deletedProduct.id);
    renderProducts();

    if (editingProductId === deletedProduct.id) {
      resetForm();
    }

    setFormMessage(`${deletedProduct.name} deleted successfully.`, 'success');
  } catch (error) {
    setFormMessage(error.message || 'Unable to delete the product.', 'error');
  }
}

function renderProducts() {
  elements.productCount.textContent = String(products.length);

  if (products.length === 0) {
    renderEmptyState('No products found. Add the first item to get started.');
    setTableState('No products yet. Add the first one using the form.', false);
    return;
  }

  elements.tableBody.innerHTML = products
    .map(
      (product) => `
        <tr>
          <td>${escapeHtml(product.name)}</td>
          <td>${formatPrice(product.price)}</td>
          <td>${product.quantity}</td>
          <td class="actions">
            <button type="button" class="action-button edit-button" data-action="edit" data-id="${product.id}">Edit</button>
            <button type="button" class="action-button delete-button" data-action="delete" data-id="${product.id}">Delete</button>
          </td>
        </tr>
      `
    )
    .join('');

  setTableState(`Showing ${products.length} products.`, false);
}

function renderEmptyState(message) {
  elements.tableBody.innerHTML = `
    <tr>
      <td colspan="4" class="empty-state">${escapeHtml(message)}</td>
    </tr>
  `;
}

function renderTableError(message) {
  elements.productCount.textContent = '0';
  elements.tableBody.innerHTML = `
    <tr>
      <td colspan="4" class="empty-state error-state">${escapeHtml(message)}</td>
    </tr>
  `;
  setTableState(message, true);
}

function resetForm(clearMessage = false) {
  editingProductId = null;
  elements.productId.value = '';
  elements.form.reset();
  elements.formTitle.textContent = 'Add Product';
  elements.submitButton.textContent = 'Save Product';
  elements.cancelButton.classList.add('hidden');

  if (clearMessage) {
    clearFormMessage();
  }
}

function setSubmitButtonState(isWorking, label) {
  elements.submitButton.disabled = isWorking;
  elements.submitButton.textContent = label;
}

function setFormMessage(message, type = '') {
  elements.formMessage.textContent = message;
  elements.formMessage.className = `message ${type}`.trim();
}

function clearFormMessage() {
  elements.formMessage.textContent = '';
  elements.formMessage.className = 'message';
}

function setTableState(message, isError) {
  elements.statusText.textContent = message;
  elements.statusText.className = isError ? 'error-state' : '';
}

function validateProduct(name, price, quantity) {
  if (!name) {
    return 'Name is required.';
  }

  if (!Number.isFinite(price) || price <= 0) {
    return 'Price must be greater than 0.';
  }

  if (!Number.isFinite(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
    return 'Quantity must be a whole number and cannot be negative.';
  }

  return '';
}

function formatPrice(value) {
  return currencyFormatter.format(Number(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function readErrorMessage(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const payload = await response.json();

      if (typeof payload === 'string') {
        return payload;
      }

      if (payload.message) {
        return payload.message;
      }

      if (payload.errors) {
        const validationMessages = collectValidationMessages(payload.errors);

        if (validationMessages.length > 0) {
          return validationMessages.join(' ');
        }
      }

      return payload.title || payload.detail || 'The request failed.';
    } catch {
      return 'The request failed.';
    }
  }

  try {
    const text = await response.text();
    return text || 'The request failed.';
  } catch {
    return 'The request failed.';
  }
}

function collectValidationMessages(errors) {
  return Object.values(errors).reduce((messages, value) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.trim()) {
          messages.push(item.trim());
        }
      }
    } else if (typeof value === 'string' && value.trim()) {
      messages.push(value.trim());
    }

    return messages;
  }, []);
}
