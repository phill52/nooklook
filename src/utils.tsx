import { useState, useEffect, useCallback } from 'react';

class TrieNode{
  children: { [key: string]: TrieNode };
  isEndOfWord: boolean;
  constructor(){
    this.children = { };
    this.isEndOfWord = false;
  }
}

export class Trie{
  root: TrieNode;
  constructor(){
    this.root = new TrieNode();
  }
  insert(word: string){
    let current = this.root;
    for (let char of word){
      if (!current.children[char]){
        current.children[char] = new TrieNode();
      }
      current = current.children[char];
    }
    current.isEndOfWord = true;
}
  search(word: string){
    let current = this.root;
    for (let char of word){
      if (!current.children[char]){
        return false;
      }
      current = current.children[char];
    }
    return current.isEndOfWord;
  }
}

export type Villager = {
  name: string;
  species: string;  
  icon_url: string;
  found: boolean;
}

export function useStopwatch() {
  const [startTime, setStartTime] = useState(() => {
    const savedStartTime = localStorage.getItem('startTime');
    return savedStartTime ? Number(savedStartTime) : 0;
  });
  const isRunning = (startTime !== 0);

  
  useEffect(() => {
    if (isRunning) {
      localStorage.setItem('startTime', startTime.toString());
    } else {
      localStorage.removeItem('startTime');
    }
  }, [isRunning, startTime]);

  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsedTime(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  
  // const elapsedTime = useMemo(() => {
  //   if (!isRunning) {
  //     return 0;
  //   }
  //   return Date.now() - startTime;
  // }, [isRunning, startTime]);

  const seconds = Math.floor((elapsedTime / 1000) % 60);
  const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
  const hours =  Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);

  const start = useCallback(() => {
    const newStartTime = Date.now();
    setStartTime(newStartTime);
  }, []);

  const reset = useCallback(() => {
    setStartTime(0);
  }, []);    

  return {seconds, minutes, hours, isRunning, start, reset};
}