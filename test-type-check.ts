import { Items } from './src'

interface User {
  id: number
  name: string
}

interface Book {
  isbn: string
  title: string
}

interface Product {
  sku: string
  name: string
  code: number
}

console.log('=== Type Inference Tests ===\n')

// Test 1: No selectId provided - I is inferred from User['id'] = number
console.log('Test 1: No selectId, infer from E["id"]')
const users = new Items<User>([{ id: 1, name: 'Alice' }])
const userId: number = users.getIds()[0]! // ✓ Type is correctly number
console.log('  User IDs type:', typeof userId, '✓')

// Test 2: With custom selectId - I is inferred from selectId return type (string)
console.log('\nTest 2: With selectId, infer from selectId return type')
const books = new Items<Book, string>([], { selectId: (book) => book.isbn })
const addedBooks = books.insert({ isbn: '978-0', title: 'TypeScript Guide' })
const bookId: string = addedBooks.getIds()[0]! // ✓ Type is correctly string
console.log('  Book IDs type:', typeof bookId, '✓')

// Test 3: selectId returning different type than default id property
console.log('\nTest 3: selectId with different return type')
const products = new Items<Product, number>([], { selectId: (p) => p.code })
const addedProducts = products.insert({ sku: 'ABC', name: 'Widget', code: 12345 })
const productId: number = addedProducts.getIds()[0]! // ✓ Type is correctly number
console.log('  Product IDs type:', typeof productId, '✓')

// Test 4: Full type inference from initial items
console.log('\nTest 4: Complete inference from initial items')
const autoInferred = new Items([{ id: 999, name: 'Test' }])
const autoId: number = autoInferred.getIds()[0]! // ✓ Both E and I are inferred
console.log('  Auto-inferred ID type:', typeof autoId, '✓')

console.log('\n✓ All type inference tests passed!')



