<script setup lang="ts">
const { defineField, setFieldValue, handleSubmit } = useForm({
  validationSchema: {},
});

const [password] = defineField('password');

const show = ref(false);
</script>

<template>
  <div>login</div>
</template>
