package search_eng;
public class MyPair<K,V> {
	private K key;
	private V value;
	/*
	 * Constructor
	 */
	public MyPair(K key, V value) {
		this.key = key;
		this.value = value;
	}

	/**
	 * Returns key of this HashPair
	 */
	public K getKey() {
		return this.key;
	}
	/**
	 * Return Value of this HashPair
	 */
	public V getValue() {
		return this.value;
	}

	/**
	 * Set the value of this HashPair
	 */
	public void setValue(V value) {
		this.value = value;
	}
}

