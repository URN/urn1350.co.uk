import Header from "../../components/header";
import Footer from "../../components/footer";
import https from 'https';

import Axios from 'axios';

import Markdown from 'markdown-to-jsx';


import Settings from '../../settings.json';

function PageName(str){
    return str.replaceAll("/", ":").split('-')
    .map(w => w[0].toUpperCase() + w.substr(1).toLowerCase())
    .join(' ');
}

export default function Page({data, p}) {
  const slug = p.join("/");
  if (!data) {
    return (
      <>
        <Header
          title={`Page Not found - ${Settings.siteTitle}`}
        />
          <h1 className="err">Unfortunately, the page you were looking for could not be found.</h1>
        <Footer />
      </>
    );
  }
  

  return (
    <>
      <Header
        title={`${PageName(slug)} - ${Settings.siteTitle}`}
        image={data.image}
        description={data.description}
      />
      <main>
      <Markdown options={{ forceBlock: false }}>
            {data}
          </Markdown>
        </main>
      <Footer/>
    </>
  );
}

// This gets called on every request
export async function getServerSideProps(context) {
  // Fetch data from external API
  var data = null;
  try {
    const instance = Axios.create({
        httpsAgent: new https.Agent({  
          rejectUnauthorized: false
        })
      });
   data = (
    await instance.get(`${Settings.cdnUrl}/website/${context.query.id.join("/")}`)
  ).data;
   } catch (err){
    console.log(err);
   }
  if (data == null) {
  }


  // Pass data to the page via props
  return { props:  {data, p: context.query.id} };
}

