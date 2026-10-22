/** Hidden from the nav — use /presenters or /account directly. */
export default function PresentersRedirect() {
  return null;
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/account',
      permanent: false,
    },
  };
}
