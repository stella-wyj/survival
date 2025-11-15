package search_eng;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedList;


public class MyHashTable<K,V> implements Iterable<MyPair<K,V>>{
	// num of entries to the table
	private int size;
	// num of buckets 
	private int capacity = 16;
	// load factor needed to check for rehashing 
	private static final double MAX_LOAD_FACTOR = 0.75;
	// ArrayList of buckets. Each bucket is a LinkedList of HashPair
	private ArrayList<LinkedList<MyPair<K,V>>> buckets; 


	// constructors
	public MyHashTable() {
		this.buckets = new ArrayList<>(capacity);
		for (int i = 0; i < capacity; i++) {
			buckets.add(new LinkedList<>());
		}
		this.size = 0;
	}

	public MyHashTable(int initialCapacity) {
		this.capacity = initialCapacity;
		this.buckets = new ArrayList<>(capacity);
		for (int i = 0; i < capacity; i++) {
			buckets.add(new LinkedList<>());
		}
		this.size = 0;
	}

	public void clear() {
		this.size = 0;
		for (int i=0; i<this.buckets.size(); i++) {
			this.buckets.get(i).clear();
		}
	}

	public int size() {
		return this.size;
	}

	public boolean isEmpty() {
		return this.size == 0;
	}

	public int numBuckets() {
		return this.capacity;
	}

	/**
	 * Returns the buckets variable. Useful for testing  purposes.
	 */
	public ArrayList<LinkedList<MyPair<K,V>>> getBuckets(){
		return this.buckets;
	}

	/**
	 * Given a key, return the bucket position for the key.
	 */
	public int hashFunction(K key) {
		int hashValue = Math.abs(key.hashCode()) % this.capacity;
		return hashValue;
	}

	/**
	 * Takes a key and a value as input and adds the corresponding HashPair
	 * to this HashTable. Expected average run time  O(1)
	 */
	public V put(K key, V value) {
		if ((double)size / capacity >= MAX_LOAD_FACTOR) {
			rehash();
		}

		int index = hashFunction(key);
		LinkedList<MyPair<K,V>> bucket = buckets.get(index);

		for (MyPair<K,V> pair : bucket) {
			if (pair.getKey().equals(key)) {
				V oldValue = pair.getValue();
				pair.setValue(value);
				return oldValue;
			}
		}

		bucket.add(new MyPair<>(key, value));
		size++;
		return null;
	}

	/**
	 * Get the value corresponding to key. Expected average runtime O(1)
	 */
	public V get(K key) {
		int index = hashFunction(key);
		LinkedList<MyPair<K,V>> bucket = buckets.get(index);

		for (MyPair<K,V> pair : bucket) {
			if (pair.getKey().equals(key)) {
				return pair.getValue();
			}
		}

		return null;
	}

	/**
	 * Remove the HashPair corresponding to key . Expected average runtime O(1)
	 */
	public V remove(K key) {
		int index = hashFunction(key);
		LinkedList<MyPair<K,V>> bucket = buckets.get(index);

		for (MyPair<K,V> pair : bucket) {
			if (pair.getKey().equals(key)) {
				V value = pair.getValue();
				bucket.remove(pair);
				size--;
				return value;
			}
		}

		return null;
	}

	/**
	 * Method to double the size of the hashtable if load factor increases
	 * beyond MAX_LOAD_FACTOR.
	 * Made public for ease of testing.
	 * Expected average runtime is O(m), where m is the number of buckets
	 */
	public void rehash() {
		ArrayList<LinkedList<MyPair<K,V>>> oldBuckets = buckets;
		capacity *= 2;
		buckets = new ArrayList<>(capacity);

		for (int i = 0; i < capacity; i++) {
			buckets.add(new LinkedList<>());
		}

		size = 0;

		for (LinkedList<MyPair<K,V>> bucket : oldBuckets) {
			for (MyPair<K,V> pair : bucket) {
				put(pair.getKey(), pair.getValue());
			}
		}
	}

	/**
	 * Return a list of all the keys present in this hashtable.
	 * Expected average runtime is O(m), where m is the number of buckets
	 */
	public ArrayList<K> keySet() {
		ArrayList<K> keys = new ArrayList<>();

		for (LinkedList<MyPair<K,V>> bucket : buckets) {
			for (MyPair<K,V> pair : bucket) {
				keys.add(pair.getKey());
			}
		}

		return keys;
	}

	/**
	 * Returns an ArrayList of unique values present in this hashtable.
	 * Expected average runtime is O(m) where m is the number of buckets
	 */
	public ArrayList<V> values() {
		ArrayList<V> values = new ArrayList<>();

		for (LinkedList<MyPair<K,V>> bucket : buckets) {
			for (MyPair<K,V> pair : bucket) {
				if (!values.contains(pair.getValue())) {
					values.add(pair.getValue());
				}
			}
		}

		return values;
	}

	/**
	 * Returns an ArrayList of all the key-value pairs present in this hashtable.
	 * Expected average runtime is O(m) where m is the number of buckets
	 */
	public ArrayList<MyPair<K, V>> entrySet() {
		ArrayList<MyPair<K,V>> entries = new ArrayList<>();

		for (LinkedList<MyPair<K,V>> bucket : buckets) {
			entries.addAll(bucket);
		}

		return entries;
	}

	@Override
	public MyHashIterator iterator() {
		return new MyHashIterator();
	}

	private class MyHashIterator implements Iterator<MyPair<K,V>> {
		private ArrayList<MyPair<K,V>> entries;
		private int currentIndex;

		private MyHashIterator() {
			entries = entrySet();
			currentIndex = 0;
		}

		@Override
		public boolean hasNext() {
			// Method should run in O(1)
			return currentIndex < entries.size();
		}

		@Override
		public MyPair<K,V> next() {
			// Method should run in O(1)
			return entries.get(currentIndex++);
		}

	}
	
	
}
