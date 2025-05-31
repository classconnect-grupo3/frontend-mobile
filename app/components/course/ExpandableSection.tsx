import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import React from 'react';

export function ExpandableSection({ title, children }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
          <AntDesign name={expanded ? 'up' : 'down'} size={16} color="#333" />
          <Text style={{ marginLeft: 10 }}>{title}</Text>
        </View>
      </TouchableOpacity>
      {expanded && <View>{children}</View>}
    </>
  );
} 
